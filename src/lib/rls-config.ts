// RLS Configuration for Never Forget
// Environment-specific setup for Row Level Security

/**
 * Environment variables needed for RLS:
 * 
 * ENABLE_RLS=true                    # Enable RLS enforcement
 * ADMIN_EMAILS=admin@example.com     # Comma-separated admin emails
 * DATABASE_URL=postgresql://...      # Main application database URL
 * SERVICE_DATABASE_URL=postgresql://... # Service role database URL (optional)
 */

export const RLS_CONFIG = {
  // Enable RLS in production and when explicitly set
  enabled: process.env.ENABLE_RLS === 'true' || process.env.NODE_ENV === 'production',
  
  // Admin emails that can bypass user-level restrictions
  adminEmails: (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').filter(Boolean),
  
  // Service database URL (for operations that bypass RLS)
  serviceDatabaseUrl: process.env.SERVICE_DATABASE_URL || process.env.DATABASE_URL,
  
  // Main application database URL
  appDatabaseUrl: process.env.DATABASE_URL,
};

/**
 * Validate RLS configuration
 */
export function validateRLSConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (RLS_CONFIG.enabled) {
    if (!RLS_CONFIG.appDatabaseUrl) {
      errors.push('DATABASE_URL is required when RLS is enabled');
    }

    if (RLS_CONFIG.adminEmails.length === 0) {
      errors.push('At least one admin email must be configured when RLS is enabled');
    }

    // Validate admin emails format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = RLS_CONFIG.adminEmails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      errors.push(`Invalid admin email format: ${invalidEmails.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Log RLS configuration status
 */
export function logRLSStatus() {
  const config = validateRLSConfig();
  
  if (RLS_CONFIG.enabled) {
    console.log('🔒 Row Level Security: ENABLED');
    console.log(`👑 Admin emails: ${RLS_CONFIG.adminEmails.length} configured`);
    
    if (!config.valid) {
      console.error('❌ RLS Configuration errors:');
      config.errors.forEach(error => console.error(`   - ${error}`));
    } else {
      console.log('✅ RLS Configuration: Valid');
    }
  } else {
    console.log('🔓 Row Level Security: DISABLED (development mode)');
  }
}

/**
 * Database connection URLs for different contexts
 */
export function getDatabaseUrl(context: 'app' | 'service' = 'app'): string {
  switch (context) {
    case 'service':
      const serviceUrl = RLS_CONFIG.serviceDatabaseUrl || '';
      return serviceUrl + (serviceUrl.includes('?') ? '&' : '?') + 'options=-c%20role%3Dservice_role';
    case 'app':
    default:
      return RLS_CONFIG.appDatabaseUrl || '';
  }
}

/**
 * Check if user is admin
 */
export function isUserAdmin(userEmail: string): boolean {
  return RLS_CONFIG.adminEmails.includes(userEmail);
}

/**
 * Get sanitized config for client-side (no sensitive data)
 */
export function getClientRLSConfig() {
  return {
    enabled: RLS_CONFIG.enabled,
    hasAdmins: RLS_CONFIG.adminEmails.length > 0,
  };
}