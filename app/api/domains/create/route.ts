import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Initialize Neon connection
const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { name, description, image, skills } = body;

    // Validate required fields
    if (!name || !description) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Name and description are required' 
        },
        { status: 400 }
      );
    }

    // Validate skills format
    let parsedSkills = [];
    if (skills) {
      try {
        parsedSkills = typeof skills === 'string' ? JSON.parse(skills) : skills;
        
        // Validate skills structure
        if (!Array.isArray(parsedSkills)) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Skills must be an array' 
            },
            { status: 400 }
          );
        }

        // Validate each skill object
        for (const skill of parsedSkills) {
          if (!skill.name || !skill.proficiency) {
            return NextResponse.json(
              { 
                success: false, 
                error: 'Each skill must have name and proficiency' 
              },
              { status: 400 }
            );
          }
        }
      } catch (error) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid skills JSON format' 
          },
          { status: 400 }
        );
      }
    }

    // Insert into database
    const result = await sql`
      INSERT INTO domains (name, description, image, skills)
      VALUES (${name}, ${description}, ${image || null}, ${JSON.stringify(parsedSkills)})
      RETURNING id, name, description, image, skills
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Domain created successfully',
      data: result[0] 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating domain:', error);
    
    // Handle database constraint errors
    if (error.code === '23505') { // Unique violation
      return NextResponse.json(
        { 
          success: false, 
          error: 'A domain with this name already exists' 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create domain',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}