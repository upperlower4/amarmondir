'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
    <section className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border">
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 md:mb-8 bg-orange-50/50 p-1 h-12 md:h-14 rounded-xl">
          <TabsTrigger value="about" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm md:text-base">
            সংক্ষিপ্ত বর্ণনা
          </TabsTrigger>
          <TabsTrigger value="article" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm md:text-base">
            বিস্তারিত খবর/ইতিহাস
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="mt-0">
          <div className="prose prose-orange max-w-none bengali-text leading-relaxed text-lg text-gray-700">
            <EditableField templeId={templeId} field="short_bio" label="সংক্ষিপ্ত বর্ণনা" currentValue={shortBio || ''} multiline editMode={editMode}>
              {shortBio ? (
                <p>{shortBio}</p>
              ) : (
                <p className="italic text-gray-400">এই মন্দিরের কোন বর্ণনা এখনো যুক্ত করা হয়নি।</p>
              )}
            </EditableField>
          </div>
        </TabsContent>

        <TabsContent value="article" className="mt-0">
          <div className="prose prose-orange max-w-none bengali-text leading-loose text-lg text-gray-700">
            <EditableField templeId={templeId} field="article_content" label="বিস্তারিত ইতিহাস" currentValue={articleContent || ''} multiline editMode={editMode}>
              {articleContent ? (
                <div>{renderArticleContent(articleContent)}</div>
              ) : (
                <div className="text-center py-12 w-full">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">বিস্তারিত ইতিহাস বা নিবন্ধ এখনো যোগ করা হয়নি।</p>
                </div>
              )}
            </EditableField>
            
            <div className="mt-8 md:mt-12 flex flex-col md:flex-row items-center justify-between p-4 md:p-8 bg-orange-50 rounded-2xl md:rounded-3xl border border-orange-100">
              <div>
                <h4 className="font-bold text-gray-900 mb-1 text-xl">আপনার তোলা ছবি আছে?</h4>
                <p className="text-gray-600 text-sm bengali-text">মন্দিরের যেকোনো নতুন ছবি বা গ্যালারি আপডেট করতে পারেন।</p>
              </div>
              <Button asChild className="mt-4 md:mt-0 bg-white hover:bg-gray-50 text-orange-600 border border-orange-200 rounded-xl h-12 px-8 flex items-center gap-2 font-bold shadow-sm">
                <Link href={`/temple/${templeSlug}?edit=true`} scroll={false}>
                  <Edit2 className="h-4 w-4" /> ছবি আপলোড করুন
                </Link>
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
