import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

// Temporary in-memory storage for development
const waitlist: Array<{
  id: string;
  email: string;
  name?: string;
  school?: string;
  interests?: string;
  createdAt: Date;
}> = [];

const waitlistSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz')
});

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Waitlist API - POST request başladı');
    
    const body = await request.json();
    console.log('📝 Request body:', body);
    
    const { email } = waitlistSchema.parse(body);
    console.log('✅ Validated email:', email);

    // Prisma ile veritabanına kaydetmeyi dene
    try {
      console.log('🗄️ Prisma ile veritabanına kayıt deneniyor...');
      
      // Önce mevcut kaydı kontrol et
      const existingEntry = await (db as any).waitlist.findUnique({
        where: { email }
      });
      
      console.log('🔍 Mevcut kayıt kontrolü:', existingEntry);

      if (existingEntry) {
        console.log('⚠️ Email zaten kayıtlı:', email);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Bu e-posta adresi zaten kayıtlı' 
          },
          { status: 400 }
        );
      }

      // Yeni kayıt oluştur
      const waitlistEntry = await (db as any).waitlist.create({
        data: {
          email,
          name: null,
          school: null,
          interests: null
        }
      });

      console.log('✅ Prisma ile kayıt başarılı:', waitlistEntry);

      return NextResponse.json({
        success: true,
        message: 'Başarıyla kayıt oldunuz! Platform açıldığında size haber vereceğiz.',
        data: {
          id: waitlistEntry.id,
          email: waitlistEntry.email
        }
      });

    } catch (prismaError) {
      console.error('❌ Prisma hatası:', prismaError);
      console.error('❌ Prisma error details:', {
        message: prismaError instanceof Error ? prismaError.message : 'Unknown error',
        stack: prismaError instanceof Error ? prismaError.stack : undefined,
        name: prismaError instanceof Error ? prismaError.name : undefined,
        code: (prismaError as any)?.code,
        meta: (prismaError as any)?.meta
      });
      console.log('🔄 In-memory storage kullanılıyor...');
      
      // Prisma başarısız olursa in-memory storage kullan
      const existingEntry = waitlist.find(entry => entry.email === email);

      if (existingEntry) {
        console.log('⚠️ In-memory: Email zaten kayıtlı:', email);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Bu e-posta adresi zaten kayıtlı' 
          },
          { status: 400 }
        );
      }

      // Create waitlist entry
      const waitlistEntry = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name: undefined,
        school: undefined,
        interests: undefined,
        createdAt: new Date()
      };

      waitlist.push(waitlistEntry);
      console.log('✅ In-memory kayıt başarılı:', waitlistEntry);

      return NextResponse.json({
        success: true,
        message: 'Başarıyla kayıt oldunuz! Platform açıldığında size haber vereceğiz.',
        data: {
          id: waitlistEntry.id,
          email: waitlistEntry.email
        }
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Geçersiz veri', 
          errors: error.issues 
        },
        { status: 400 }
      );
    }

    console.error('Waitlist registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Bir hata oluştu, lütfen tekrar deneyin' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Waitlist API - GET request başladı');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('📋 Sayfalama parametreleri:', { page, limit });

    // Prisma ile veritabanından veri çekmeyi dene
    try {
      console.log('🗄️ Prisma ile veritabanından veri çekiliyor...');
      
      const [entries, totalCount] = await Promise.all([
        (db as any).waitlist.findMany({
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        (db as any).waitlist.count()
      ]);

      console.log('✅ Prisma ile veri çekme başarılı:', { 
        entriesCount: entries.length, 
        totalCount 
      });

      return NextResponse.json({
        success: true,
        data: {
          entries,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: Math.ceil(totalCount / limit)
          }
        }
      });

    } catch (prismaError) {
      console.error('❌ Prisma GET hatası:', prismaError);
      console.log('🔄 In-memory storage kullanılıyor...');
      
      // Prisma başarısız olursa in-memory storage kullan
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const entries = waitlist
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(startIndex, endIndex);
      const totalCount = waitlist.length;

      console.log('✅ In-memory veri çekme başarılı:', { 
        entriesCount: entries.length, 
        totalCount 
      });

      return NextResponse.json({
        success: true,
        data: {
          entries,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: Math.ceil(totalCount / limit)
          }
        }
      });
    }

  } catch (error) {
    console.error('❌ Waitlist fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Veriler alınamadı' 
      },
      { status: 500 }
    );
  }
}
