module.exports = {
    // Cấu hình server
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Cấu hình JWT
    jwt: {
      secret: process.env.JWT_SECRET || 'your_super_secret_key_for_jwt_tokens',
      expiresIn: process.env.JWT_EXPIRES_IN || '30d'
    },
    
    // Cấu hình frontend
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
    
    // Cấu hình công cụ
    pagination: {
      defaultLimit: 10,
      maxLimit: 100
    }
  };