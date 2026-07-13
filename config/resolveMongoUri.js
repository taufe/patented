const dns = require('dns').promises;
const { getMongoUri, isVercel } = require('./env');

let cachedDirectUri = null;

const stripQuotes = (value) => {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
};

const getDirectMongoUriOverride = () =>
  stripQuotes(process.env.MONGO_URI_DIRECT || process.env.MONGODB_URI_DIRECT || '');

const mergeQueryParams = (existingQuery, txtParams) => {
  const params = new URLSearchParams(existingQuery);

  if (txtParams) {
    txtParams.split('&').forEach((pair) => {
      const [key, value = ''] = pair.split('=');

      if (key && !params.has(key)) {
        params.set(key, value);
      }
    });
  }

  if (!params.has('ssl')) {
    params.set('ssl', 'true');
  }

  return params.toString();
};

const srvToDirectUri = async (srvUri) => {
  if (!srvUri.startsWith('mongodb+srv://')) {
    return srvUri;
  }

  const withoutScheme = srvUri.slice('mongodb+srv://'.length);
  const atIndex = withoutScheme.lastIndexOf('@');

  if (atIndex === -1) {
    return srvUri;
  }

  const credentials = withoutScheme.slice(0, atIndex);
  const rest = withoutScheme.slice(atIndex + 1);
  const slashIndex = rest.indexOf('/');
  const host = slashIndex === -1 ? rest.split('?')[0] : rest.slice(0, slashIndex);
  const pathAndQuery = slashIndex === -1 ? '' : rest.slice(slashIndex);
  const queryIndex = pathAndQuery.indexOf('?');
  const dbPath = queryIndex === -1 ? pathAndQuery : pathAndQuery.slice(0, queryIndex);
  const existingQuery = queryIndex === -1 ? '' : pathAndQuery.slice(queryIndex + 1);

  const [srvRecords, txtRecords] = await Promise.all([
    dns.resolveSrv(`_mongodb._tcp.${host}`),
    dns.resolveTxt(host).catch(() => []),
  ]);

  const hosts = srvRecords.map((record) => `${record.name}:${record.port}`).join(',');
  const txtParams = txtRecords.flat().join('&');
  const query = mergeQueryParams(existingQuery, txtParams);

  return `mongodb://${credentials}@${hosts}${dbPath}${query ? `?${query}` : ''}`;
};

const getResolvedMongoUri = async () => {
  const directOverride = getDirectMongoUriOverride();

  if (isVercel && directOverride) {
    return directOverride;
  }

  const mongoUri = getMongoUri();

  if (!mongoUri) {
    return mongoUri;
  }

  if (!isVercel || !mongoUri.startsWith('mongodb+srv://')) {
    return mongoUri;
  }

  if (cachedDirectUri) {
    return cachedDirectUri;
  }

  try {
    cachedDirectUri = await srvToDirectUri(mongoUri);
    return cachedDirectUri;
  } catch (error) {
    throw new Error(
      `Failed to resolve MongoDB SRV on Vercel: ${error.message}. Set MONGO_URI_DIRECT in Vercel to the standard (non-SRV) connection string from Atlas → Connect → Drivers.`
    );
  }
};

module.exports = {
  getResolvedMongoUri,
  srvToDirectUri,
};
