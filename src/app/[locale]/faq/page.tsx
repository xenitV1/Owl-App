'use client';

import React, { useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'OWL Platform nedir?',
      answer: 'OWL Platform, öğrencilerin ders notlarını paylaşmasını, AI destekli içerik oluşturmasını ve birlikte öğrenmesini sağlayan yeni nesil bir akademik sosyal platformdur.'
    },
    {
      question: 'Platform ne zaman aktif olacak?',
      answer: 'Platform şu anda geliştirme aşamasında. Lansmanımız yakında gerçekleşecek. Beyaz listeye kaydolarak ilk haberdar olanlar arasında olabilirsiniz.'
    },
    {
      question: 'Platformun ücreti ne kadar?',
      answer: 'OWL Platform öğrenciler için ücretsiz olacak. Premium özellikler için uygun fiyatlı planlar sunulacak. Erken kayıt olanlar için özel indirimler olacak.'
    },
    {
      question: 'AI özellikleri nasıl çalışıyor?',
      answer: 'AI sistemimiz, dökümanlarınızdan otomatik olarak flashcard, özet ve soru-cevap setleri oluşturur. Gemini AI kullanarak yüksek kaliteli eğitim içeriği üretir.'
    },
    {
      question: 'Verilerim güvende mi?',
      answer: 'Evet! KVKK ve GDPR standartlarına uygun şekilde verilerinizi koruyoruz. SSL şifreleme, güvenli saklama ve düzenli güvenlik denetimleri yapıyoruz.'
    },
    {
      question: 'Hangi dosya formatlarını destekliyorsunuz?',
      answer: 'PDF, Word (DOCX), PowerPoint (PPTX), metin dosyaları ve görselleri destekliyoruz. AI sistemi bu dosyalardan otomatik içerik çıkarabilir.'
    },
    {
      question: 'Çalışma grupları nasıl oluşturulur?',
      answer: 'Platform aktif olduğunda, sınıf arkadaşlarınızla kolayca grup oluşturabilecek, not paylaşımı yapabilecek ve birlikte çalışabileceksiniz.'
    },
    {
      question: 'Mobil uygulama var mı?',
      answer: 'Şu anda web platformu üzerinde çalışıyoruz. Mobil uygulamalar gelecekte planlarımız arasında.'
    },
    {
      question: 'İçeriklerimi nasıl paylaşabilirim?',
      answer: 'Notlarınızı ve çalışma materyallerinizi topluluklarla veya özel gruplarla paylaşabileceksiniz. Gizlilik kontrolü tamamen sizde.'
    },
    {
      question: 'Destek nasıl alabilirim?',
      answer: 'mehmet.apaydin0@outlook.com adresinden bize ulaşabilirsiniz. Platform aktif olduğunda canlı destek de sunacağız.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Geri Dön
            </Button>
            
            <div className="flex items-center justify-center mb-6">
              <Logo size="lg" />
            </div>
            
            <h1 className="text-4xl font-bold text-center mb-4 text-gray-900">
              Sık Sorulan Sorular
            </h1>
            <p className="text-center text-gray-600 mb-8">
              OWL Platform hakkında merak ettikleriniz
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => toggleFAQ(index)}
              >
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {faq.question}
                      </h3>
                      {openIndex === index && (
                        <p className="text-gray-600 mt-3 pr-8">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      {openIndex === index ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardContent className="pt-6 text-center">
              <p className="text-gray-700 mb-4">
                Sorunuz burada yok mu?
              </p>
              <Button asChild>
                <a href="mailto:mehmet.apaydin0@outlook.com">
                  Bize Ulaşın
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

