import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface InternshipUpdateData {
  title: string;
  description?: string;
  domain?: string;
  start_date: string;
  end_date: string;
  price: number;
  banner_url?: string;
  mode: 'virtual' | 'physical';
  location?: string;
  skills?: any[];
  certificate?: boolean;
  certificate_title?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params:  Promise<{ id: string }> }
) {
  try {
    const { id } =  await params;
    
    const internship = await sql`
      SELECT 
        *
      FROM internships 
      WHERE id = ${id}
    `;

    if (internship.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Internship not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: internship[0]
    });
  } catch (error) {
    console.error('Error fetching internship:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch internship' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const data: InternshipUpdateData = await request.json();

    console.log('Update request for ID:', id);
    console.log('Update data:', data);

    // Validate required fields
    if (!data.title || !data.start_date || !data.end_date || !data.price || !data.mode) {
      console.error('Missing required fields:', {
        title: data.title,
        start_date: data.start_date,
        end_date: data.end_date,
        price: data.price,
        mode: data.mode
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: title, start_date, end_date, price, and mode are required' 
        },
        { status: 400 }
      );
    }

    // Validate mode
    if (!['virtual', 'physical'].includes(data.mode)) {
      return NextResponse.json(
        { success: false, error: 'Mode must be either "virtual" or "physical"' },
        { status: 400 }
      );
    }

    // Check if internship exists
    const existing = await sql`
      SELECT id FROM internships WHERE id = ${parseInt(id)}
    `;

    if (existing.length === 0) {
      console.error('Internship not found:', id);
      return NextResponse.json(
        { success: false, error: 'Internship not found' },
        { status: 404 }
      );
    }

    // Prepare data for update
    const updateData = {
      title: data.title,
      description: data.description || null,
      domain: data.domain || null,
      start_date: data.start_date,
      end_date: data.end_date,
      price: parseFloat(data.price.toString()), // Ensure it's a number
      banner_url: data.banner_url || null,
      mode: data.mode,
      location: data.location || null,
      skills: data.skills ? JSON.stringify(data.skills) : null,
      certificate: data.certificate || false,
      certificate_title: data.certificate_title || null,
    };

    console.log('Update data prepared:', updateData);

    // Update the internship
    const updatedInternship = await sql`
      UPDATE internships 
      SET 
        title = ${updateData.title},
        description = ${updateData.description},
        domain = ${updateData.domain},
        start_date = ${updateData.start_date},
        end_date = ${updateData.end_date},
        price = ${updateData.price},
        banner_url = ${updateData.banner_url},
        mode = ${updateData.mode},
        location = ${updateData.location},
        skills = ${updateData.skills},
        certificate = ${updateData.certificate},
        certificate_title = ${updateData.certificate_title}
      WHERE id = ${parseInt(id)}
      RETURNING 
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
        certificate_title
    `;

    console.log('Update successful:', updatedInternship[0]);

    return NextResponse.json({
      success: true,
      data: updatedInternship[0],
      message: 'Internship updated successfully'
    });
  } catch (error) {
    console.error('Error updating internship:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update internship',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete internship
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    console.log('Delete request for ID:', id);

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { success: false, error: 'Invalid internship ID' },
        { status: 400 }
      );
    }

    const internshipId = parseInt(id);

    // Check if internship exists
    const existing = await sql`
      SELECT id, title FROM internships WHERE id = ${internshipId}
    `;

    if (existing.length === 0) {
      console.error('Internship not found for deletion:', id);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Internship not found' 
        },
        { status: 404 }
      );
    }

    console.log('Found internship for deletion:', existing[0].title);

    // Delete the internship
    const result = await sql`
      DELETE FROM internships WHERE id = ${internshipId}
      RETURNING id, title
    `;

    if (result.length === 0) {
      throw new Error('No internship was deleted');
    }

    console.log('Internship deleted successfully:', {
      id: result[0].id,
      title: result[0].title
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result[0].id,
        title: result[0].title
      },
      message: `Internship "${result[0].title}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting internship:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete internship',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}