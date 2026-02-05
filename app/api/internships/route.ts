import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');
    const mode = searchParams.get('mode');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const hasCertificate = searchParams.get('hasCertificate');

    // Build query
    let query = sql`
      SELECT 
        id, 
        title, 
        description, 
        domain,
        start_date,
        end_date,
        price,
        banner_url,
        mode,
        location,
        skills,
        certificate,
        certificate_title,
        CASE 
          WHEN end_date < CURRENT_DATE THEN 'expired'
          WHEN start_date > CURRENT_DATE THEN 'upcoming'
          ELSE 'active'
        END as status
      FROM internships
      WHERE 1=1
    `;

    // Apply filters
    if (domain) {
      query = sql`${query} AND domain = ${domain}`;
    }

    if (mode) {
      query = sql`${query} AND mode = ${mode}`;
    }

    if (minPrice) {
      query = sql`${query} AND price >= ${parseFloat(minPrice)}`;
    }

    if (maxPrice) {
      query = sql`${query} AND price <= ${parseFloat(maxPrice)}`;
    }

    if (search) {
      query = sql`${query} AND (
        title ILIKE ${'%' + search + '%'} OR
        description ILIKE ${'%' + search + '%'} OR
        domain ILIKE ${'%' + search + '%'}
      )`;
    }

    if (hasCertificate === 'true') {
      query = sql`${query} AND certificate = true`;
    }

    // Order by start date
    query = sql`${query} ORDER BY start_date ASC`;

    const internships = await query;

    return NextResponse.json({ 
      success: true, 
      data: internships,
      count: internships.length
    });
    
  } catch (error) {
    console.error('Error fetching internships:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch internships' },
      { status: 500 }
    );
  }
}