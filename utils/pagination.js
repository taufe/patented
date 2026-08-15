const getPagination = (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const paginationMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit) || 0,
});

module.exports = {
  getPagination,
  paginationMeta,
};
