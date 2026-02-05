import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// GET single domain
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid domain ID' },
        { status: 400 }
      );
    }

    const domain = await sql`
      SELECT id, name, description, image, skills 
      FROM domains 
      WHERE id = ${id}
    `;

    if (domain.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: domain[0] 
    });

  } catch (error) {
    console.error('Error fetching domain:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch domain',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

// UPDATE domain
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise< { id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    const body = await request.json();
    const { name, description, image, skills } = body;

    // Validate required fields
    if (!name || !description) {
      return NextResponse.json(
        { success: false, error: 'Name and description are required' },
        { status: 400 }
      );
    }

    // Validate ID
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid domain ID' },
        { status: 400 }
      );
    }

    // Check if domain exists
    const domainExists = await sql`
      SELECT id FROM domains WHERE id = ${id}
    `;

    if (domainExists.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Validate skills format if provided
    let parsedSkills = [];
    if (skills) {
      try {
        parsedSkills = Array.isArray(skills) ? skills : JSON.parse(skills);
        
        if (!Array.isArray(parsedSkills)) {
          return NextResponse.json(
            { success: false, error: 'Skills must be an array' },
            { status: 400 }
          );
        }

        // Validate each skill
        for (const skill of parsedSkills) {
          if (!skill.name || !skill.proficiency) {
            return NextResponse.json(
              { success: false, error: 'Each skill must have name and proficiency' },
              { status: 400 }
            );
          }
          
          if (!['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(skill.proficiency)) {
            return NextResponse.json(
              { success: false, error: 'Invalid proficiency level' },
              { status: 400 }
            );
          }
        }
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Invalid skills format' },
          { status: 400 }
        );
      }
    }

    // Update the domain
    const result = await sql`
      UPDATE domains 
      SET 
        name = ${name},
        description = ${description},
        image = ${image || null},
        skills = ${JSON.stringify(parsedSkills)}
      WHERE id = ${id}
      RETURNING id, name, description, image, skills
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Domain updated successfully',
      data: result[0]
    });

  } catch (error: any) {
    console.error('Error updating domain:', error);
    
    // Handle database constraint errors
    if (error.code === '23505') { // Unique violation
      return NextResponse.json(
        { success: false, error: 'A domain with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update domain',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE domain
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise< { id: string }> }
) {
  try {
    const id = parseInt((await params).id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid domain ID' },
        { status: 400 }
      );
    }

    // First check if the domain exists
    const domainExists = await sql`
      SELECT id FROM domains WHERE id = ${id}
    `;

    if (domainExists.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Delete the domain
    await sql`
      DELETE FROM domains WHERE id = ${id}
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Domain deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete domain',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}