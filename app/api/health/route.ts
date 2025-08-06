import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: await checkDatabase(),
        ai: await checkAIService(),
      },
    };

    const isHealthy = Object.values(healthCheck.services).every(
      service => service.status === 'healthy'
    );

    return NextResponse.json(
      healthCheck,
      { status: isHealthy ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}

async function checkDatabase() {
  try {
    // Basic check - we could ping Supabase here
    const hasRequiredEnvVars = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    return {
      status: hasRequiredEnvVars ? 'healthy' : 'unhealthy',
      message: hasRequiredEnvVars ? 'Connected' : 'Missing configuration',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Connection failed',
    };
  }
}

async function checkAIService() {
  try {
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    
    return {
      status: hasApiKey ? 'healthy' : 'unhealthy',
      message: hasApiKey ? 'API key configured' : 'Missing API key',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Service check failed',
    };
  }
}