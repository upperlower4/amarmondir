import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('0357fa7ab2a145be93537558a14ad7fd', {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
