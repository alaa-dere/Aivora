import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

type PageContentRow = RowDataPacket & {
  heroTitleEn: string;
  heroTitleAr: string;
  heroDescriptionEn: string;
  heroDescriptionAr: string;
  aboutTitleEn: string;
  aboutTitleAr: string;
  aboutDescriptionEn: string;
  aboutDescriptionAr: string;
  contactEmail: string;
  contactPhone: string;
  contactLocationEn: string;
  contactLocationAr: string;
  contactDescriptionEn: string;
  contactDescriptionAr: string;
};

export async function GET() {
  try {
    const [pageRows] = await db.query<PageContentRow[]>(
      `SELECT 
        heroTitleEn, heroTitleAr,
        heroDescriptionEn, heroDescriptionAr,
        aboutTitleEn, aboutTitleAr,
        aboutDescriptionEn, aboutDescriptionAr,
        contactEmail, contactPhone, contactLocationEn, contactLocationAr,
        contactDescriptionEn, contactDescriptionAr
       FROM HomePageContent
       WHERE id = 1
       LIMIT 1`
    );

    const [featuredCourses] = await db.query<RowDataPacket[]>(
      `SELECT id, titleEn, titleAr, instructorEn, instructorAr, durationEn, durationAr,
              studentsTextEn, studentsTextAr, imageUrl, courseLink, price, rating, sortOrder
       FROM HomeFeaturedCourse
       WHERE isActive = 1
       ORDER BY sortOrder ASC, createdAt DESC`
    );

    const [testimonials] = await db.query<RowDataPacket[]>(
      `SELECT id, language, fullName, roleTitle, content, avatarUrl, rating, sortOrder
       FROM HomeTestimonial
       WHERE isActive = 1
       ORDER BY sortOrder ASC, createdAt DESC`
    );

    const [studentReviews] = await db.query<RowDataPacket[]>(
      `SELECT id, language, studentName, reviewText, courseTitle, rating, sortOrder
       FROM HomeStudentReview
       WHERE isActive = 1
       ORDER BY sortOrder ASC, createdAt DESC`
    );

    const page = pageRows[0] || {
      heroTitleEn: 'Learn Smarter. Build Faster.',
      heroTitleAr: 'Learn Smarter. Build Faster.',
      heroDescriptionEn:
        'Aivora helps students and professionals master AI and software skills with practical projects.',
      heroDescriptionAr:
        'Aivora helps students and professionals master AI and software skills with practical projects.',
      aboutTitleEn: 'About Aivora',
      aboutTitleAr: 'About Aivora',
      aboutDescriptionEn:
        'A modern learning platform with guided paths, practical assignments, and clear progress tracking.',
      aboutDescriptionAr:
        'A modern learning platform with guided paths, practical assignments, and clear progress tracking.',
      contactEmail: 'support@aivora.com',
      contactPhone: '+970 599 123 456',
      contactLocationEn: 'Nablus, Palestine',
      contactLocationAr: 'Nablus, Palestine',
      contactDescriptionEn: 'We are here to support your learning journey.',
      contactDescriptionAr: 'We are here to support your learning journey.',
    };

    return NextResponse.json({
      hero: {
        titleEn: page.heroTitleEn,
        titleAr: page.heroTitleAr,
        descriptionEn: page.heroDescriptionEn,
        descriptionAr: page.heroDescriptionAr,
      },
      about: {
        titleEn: page.aboutTitleEn,
        titleAr: page.aboutTitleAr,
        descriptionEn: page.aboutDescriptionEn,
        descriptionAr: page.aboutDescriptionAr,
      },
      contact: {
        email: page.contactEmail,
        phone: page.contactPhone,
        locationEn: page.contactLocationEn,
        locationAr: page.contactLocationAr,
        descriptionEn: page.contactDescriptionEn,
        descriptionAr: page.contactDescriptionAr,
      },
      featuredCourses: featuredCourses.map((item) => ({
        ...item,
        price: Number(item.price),
        rating: Number(item.rating),
        sortOrder: Number(item.sortOrder || 0),
      })),
      testimonials: {
        en: testimonials
          .filter((item) => item.language === 'en')
          .map((item) => ({ ...item, rating: Number(item.rating) })),
        ar: testimonials
          .filter((item) => item.language === 'ar')
          .map((item) => ({ ...item, rating: Number(item.rating) })),
      },
      studentReviews: {
        en: studentReviews
          .filter((item) => item.language === 'en')
          .map((item) => ({ ...item, rating: Number(item.rating) })),
        ar: studentReviews
          .filter((item) => item.language === 'ar')
          .map((item) => ({ ...item, rating: Number(item.rating) })),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching home content:', error);
    return NextResponse.json(
      { message: 'Failed to fetch home content', error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const heroTitleEn = String(body.heroTitleEn || '').trim();
    const heroTitleAr = String(body.heroTitleAr || '').trim();
    const heroDescriptionEn = String(body.heroDescriptionEn || '').trim();
    const heroDescriptionAr = String(body.heroDescriptionAr || '').trim();
    const aboutTitleEn = String(body.aboutTitleEn || '').trim();
    const aboutTitleAr = String(body.aboutTitleAr || '').trim();
    const aboutDescriptionEn = String(body.aboutDescriptionEn || '').trim();
    const aboutDescriptionAr = String(body.aboutDescriptionAr || '').trim();
    const contactEmail = String(body.contactEmail || '').trim();
    const contactPhone = String(body.contactPhone || '').trim();
    const contactLocationEn = String(body.contactLocationEn || '').trim();
    const contactLocationAr = String(body.contactLocationAr || '').trim();
    const contactDescriptionEn = String(body.contactDescriptionEn || '').trim();
    const contactDescriptionAr = String(body.contactDescriptionAr || '').trim();

    if (
      !heroTitleEn ||
      !heroTitleAr ||
      !heroDescriptionEn ||
      !heroDescriptionAr ||
      !aboutTitleEn ||
      !aboutTitleAr ||
      !aboutDescriptionEn ||
      !aboutDescriptionAr ||
      !contactEmail ||
      !contactPhone ||
      !contactLocationEn ||
      !contactLocationAr ||
      !contactDescriptionEn ||
      !contactDescriptionAr
    ) {
      return NextResponse.json(
        { message: 'All hero, about, and contact fields are required' },
        { status: 400 }
      );
    }

    await db.query(
      `INSERT INTO HomePageContent (
        id,
        heroTitleEn, heroTitleAr,
        heroDescriptionEn, heroDescriptionAr,
        aboutTitleEn, aboutTitleAr,
        aboutDescriptionEn, aboutDescriptionAr,
        contactEmail, contactPhone, contactLocationEn, contactLocationAr,
        contactDescriptionEn, contactDescriptionAr
      )
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        heroTitleEn = VALUES(heroTitleEn),
        heroTitleAr = VALUES(heroTitleAr),
        heroDescriptionEn = VALUES(heroDescriptionEn),
        heroDescriptionAr = VALUES(heroDescriptionAr),
        aboutTitleEn = VALUES(aboutTitleEn),
        aboutTitleAr = VALUES(aboutTitleAr),
        aboutDescriptionEn = VALUES(aboutDescriptionEn),
        aboutDescriptionAr = VALUES(aboutDescriptionAr),
        contactEmail = VALUES(contactEmail),
        contactPhone = VALUES(contactPhone),
        contactLocationEn = VALUES(contactLocationEn),
        contactLocationAr = VALUES(contactLocationAr),
        contactDescriptionEn = VALUES(contactDescriptionEn),
        contactDescriptionAr = VALUES(contactDescriptionAr),
        updatedAt = NOW()`,
      [
        heroTitleEn,
        heroTitleAr,
        heroDescriptionEn,
        heroDescriptionAr,
        aboutTitleEn,
        aboutTitleAr,
        aboutDescriptionEn,
        aboutDescriptionAr,
        contactEmail,
        contactPhone,
        contactLocationEn,
        contactLocationAr,
        contactDescriptionEn,
        contactDescriptionAr,
      ]
    );

    return NextResponse.json({ success: true, message: 'Home page content updated' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating home content:', error);
    return NextResponse.json(
      { message: 'Failed to update home content', error: errorMessage },
      { status: 500 }
    );
  }
}
