import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/db/connection';
import { RealEstateProperty } from '@/db/models';

// Helper to check if URL is valid
function isValidUrl(url: string): boolean {
  if (!url || url === '#' || url.trim() === '') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Generate a nice error page HTML
function generateErrorPage(title: string, message: string, backUrl: string = '/real-estate'): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - RFM TradePro</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a0e14 0%, #1a1f2e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: #0f1419;
      border: 1px solid #1e2733;
      border-radius: 16px;
      padding: 48px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: rgba(239, 68, 68, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon svg {
      width: 40px;
      height: 40px;
      color: #ef4444;
    }
    h1 {
      color: #ffffff;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    p {
      color: #6b7a90;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #22c55e;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      transition: background 0.2s;
    }
    .button:hover {
      background: #1ea550;
    }
    .button svg {
      width: 16px;
      height: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="${backUrl}" class="button">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Real Estate
    </a>
  </div>
</body>
</html>
`;
}

// GET - Redirect to actual document URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; document: string }> }
) {
  try {
    const { slug, document: docSlug } = await params;
    
    await connectToDatabase();
    
    // Find property by slug
    const property = await RealEstateProperty.findOne({ 
      slug,
      isActive: true 
    }).lean();
    
    if (!property) {
      return new NextResponse(
        generateErrorPage(
          'Property Not Found',
          'The property you are looking for does not exist or has been removed.'
        ),
        { 
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }
    
    // Find document by slug (remove .pdf extension if present)
    const cleanDocSlug = docSlug.replace(/\.pdf$/i, '');
    const doc = property.documents?.find(
      (d: { slug: string }) => d.slug === cleanDocSlug
    );
    
    if (!doc || !doc.url) {
      return new NextResponse(
        generateErrorPage(
          'Document Not Found',
          'The document you are looking for does not exist for this property.'
        ),
        { 
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }
    
    // Validate URL before redirecting
    if (!isValidUrl(doc.url)) {
      return new NextResponse(
        generateErrorPage(
          'Document Unavailable',
          'This document is not yet available. The property documents are being prepared and will be uploaded soon. Please check back later.'
        ),
        { 
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }
    
    // Redirect to the actual Cloudinary URL
    return NextResponse.redirect(doc.url, { status: 302 });
  } catch (error) {
    console.error('Error fetching document:', error);
    return new NextResponse(
      generateErrorPage(
        'Something Went Wrong',
        'We encountered an error while loading the document. Please try again later.'
      ),
      { 
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}
