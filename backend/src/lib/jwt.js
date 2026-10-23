const getJwtSecret = () => process.env.JWT_SECRET || 'secret_key_provisoria';

module.exports = { getJwtSecret };
