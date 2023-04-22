const authorization = (roles) => {
  return (req, res, next) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ msg: "You are not authorized" });
    }
  };
};
module.exports = { authorization };
