'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { EditableField } from '@/components/temple/EditableField';

interface TempleTabsProps {
  shortBio: string | null;
  articleContent: string | null;
  templeSlug: string;
  templeId: string;
  editMode?: boolean;
}

export function TempleTabs({ templeId, shortBio, articleContent, templeSlug, editMode = false }: TempleTabsProps) {
  const renderArticleContent = (article?: string | null) => {
    if (!article) return null;

    return article
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph, index) => (
        <p key={index} className="mb-4 whitespace-pre-line">
          {paragraph}
        </p>
      ));
  }

  return (
    <div className="space-y-12">
      {/* Short Bio Section */}
      <section>
        <h3 className="text-xl md:text-2xl font-bold font-serif text-gray-900 mb-4 pb-2 border-b border-gray-100">
          সংক্ষিপ্ত বর্ণনা
        </h3>
        <div className="prose prose-orange max-w-none bengali-text leading-relaxed text-lg text-gray-700">
          <EditableField templeId={templeId} field="short_bio" label="সংক্ষিপ্ত বর্ণনা" currentValue={shortBio || ''} multiline editMode={editMode}>
            {shortBio ? (
              <p>{shortBio}</p>
            ) : (
              <p className="italic text-gray-400 text-base">এই মন্দিরের কোন বর্ণনা এখনো যুক্ত করা হয়নি।</p>
            )}
          </EditableField>
        </div>
      </section>

      {/* Article Content Section */}
      <section>
        <h3 className="text-xl md:text-2xl font-bold font-serif text-gray-900 mb-6 pb-2 border-b border-gray-100">
          বিস্তারিত ইতিহাস ও বিবরণ
        </h3>
        <div className="prose prose-orange max-w-none bengali-text leading-loose text-lg text-gray-700">
          <EditableField templeId={templeId} field="article_content" label="বিস্তারিত ইতিহাস" currentValue={articleContent || ''} multiline editMode={editMode}>
            {articleContent ? (
              <div>{renderArticleContent(articleContent)}</div>
            ) : (
              <div className="text-center py-12 w-full bg-gray-50 rounded-xl border border-gray-100">
                <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-base">বিস্তারিত ইতিহাস বা নিবন্ধ এখনো যোগ করা হয়নি।</p>
              </div>
            )}
          </EditableField>
          
          <div className="mt-8 md:mt-12 flex flex-col md:flex-row items-center justify-between p-5 bg-orange-50 rounded-2xl border border-orange-100/50">
            <div>
              <h4 className="font-bold text-gray-900 mb-1 text-lg">আপনার তোলা ছবি আছে?</h4>
              <p className="text-gray-600 text-sm bengali-text">মন্দিরের যেকোনো নতুন ছবি বা গ্যালারি আপডেট করতে পারেন।</p>
            </div>
            <Button asChild className="mt-4 md:mt-0 bg-white hover:bg-gray-50 text-orange-600 border border-orange-200 rounded-xl font-bold shadow-sm">
              <Link href={`/temple/${templeSlug}?edit=true`} scroll={false}>
                <Edit2 className="h-4 w-4 mr-2" /> ছবি আপলোড করুন
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
