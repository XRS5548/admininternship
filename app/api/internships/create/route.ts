import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
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
      certificate_title
    } = body;

    // Validation
    if (!title || !description || !domain || !start_date || !end_date || price === undefined || !mode) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields' 
        },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid date format' 
        },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'End date must be after start date' 
        },
        { status: 400 }
      );
    }

    // Validate price
    if (price < 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Price cannot be negative' 
        },
        { status: 400 }
      );
    }

    // Validate mode
    if (!['virtual', 'physical'].includes(mode)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Mode must be either virtual or physical' 
        },
        { status: 400 }
      );
    }

    // Validate skills format if provided
    let parsedSkills = [];
    if (skills) {
      try {
        parsedSkills = typeof skills === 'string' ? JSON.parse(skills) : skills;
        
        if (!Array.isArray(parsedSkills)) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Skills must be an array' 
            },
            { status: 400 }
          );
        }

        // Validate each skill
        for (const skill of parsedSkills) {
          if (!skill.name || !skill.level) {
            return NextResponse.json(
              { 
                success: false, 
                error: 'Each skill must have name and level' 
              },
              { status: 400 }
            );
          }
          
          if (!['Basic', 'Intermediate', 'Advanced'].includes(skill.level)) {
            return NextResponse.json(
              { 
                success: false, 
                error: 'Skill level must be Basic, Intermediate, or Advanced' 
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

    // Validate certificate title if certificate is true
    if (certificate && !certificate_title) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Certificate title is required when certificate is enabled' 
        },
        { status: 400 }
      );
    }

    // Insert into database
    const result = await sql`
      INSERT INTO internships (
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
        certificate_title
      ) VALUES (
        ${title},
        ${description},
        ${domain},
        ${start_date},
        ${end_date},
        ${price},
        ${banner_url || null},
        ${mode},
        ${location || null},
        ${JSON.stringify(parsedSkills)},
        ${certificate || false},
        ${certificate_title || null}
      )
      RETURNING *
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Internship created successfully',
      data: result[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating internship:', error);
    
    // Handle database errors
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { 
          success: false, 
          error: 'An internship with similar details already exists' 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create internship',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}