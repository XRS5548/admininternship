import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Initialize Neon connection
const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const domains = await sql`
      SELECT id, name, description, image, skills 
      FROM domains 
      ORDER BY id ASC
    `;
    
    return NextResponse.json({ success: true, data: domains });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, image, skills } = body;

    const result = await sql`
      INSERT INTO domains (name, description, image, skills)
      VALUES (${name}, ${description}, ${image}, ${skills})
      RETURNING id, name, description, image, skills
    `;

    return NextResponse.json({ 
      success: true, 
      data: result[0] 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating domain:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create domain' },
      { status: 500 }
    );
  }
}