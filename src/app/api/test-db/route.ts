import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Test DB API - Başlatılıyor...');
    
    // Prisma bağlantısını test et
    console.log('🔌 Prisma bağlantısı test ediliyor...');
    
    // Basit bir sorgu çalıştır
    const userCount = await db.user.count();
    console.log('👥 Toplam kullanıcı sayısı:', userCount);
    
    // Waitlist tablosunu test et
    try {
      const waitlistCount = await (db as any).waitlist.count();
      console.log('📋 Waitlist kayıt sayısı:', waitlistCount);
      
      // Tüm waitlist kayıtlarını getir
      const waitlistEntries = await (db as any).waitlist.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      
      console.log('📝 Son 10 waitlist kaydı:', waitlistEntries);
      
      return NextResponse.json({
        success: true,
        message: 'Veritabanı bağlantısı başarılı',
        data: {
          userCount,
          waitlistCount,
          recentEntries: waitlistEntries
        }
      });
      
    } catch (waitlistError) {
      console.error('❌ Waitlist tablosu hatası:', waitlistError);
      
      return NextResponse.json({
        success: false,
        message: 'Waitlist tablosu hatası',
        error: waitlistError instanceof Error ? waitlistError.message : 'Bilinmeyen hata',
        data: {
          userCount,
          waitlistError: true
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Test DB hatası:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Veritabanı bağlantı hatası',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 });
  }
}