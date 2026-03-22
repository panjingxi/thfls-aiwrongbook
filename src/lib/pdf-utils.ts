import * as pdfjsLib from 'pdfjs-dist';

// Define the worker script path
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Converts a PDF file into an array of image files (one image per page).
 * @param pdfFile The input PDF file
 * @param scale The rendering scale (higher = better quality, larger size)
 * @returns Array of File objects representing the pages as JPEGs
 */
export async function convertPdfToImages(pdfFile: File, scale: number = 2.0): Promise<File[]> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    
    const numPages = pdfDocument.numPages;
    const imageFiles: File[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
            throw new Error('Failed to get 2d context for canvas');
        }
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: context,
            viewport: viewport,
            background: 'white' // Ensure white background, otherwise transparent parts become black in JPEG
        };
        
        await page.render(renderContext).promise;
        
        // Convert canvas to blob
        const blob = await new Promise<Blob | null>((resolve) => {
            // Use JPEG for better compression of document pages
            canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9); 
        });
        
        if (blob) {
            // Create a File object from the Blob
            const fileName = `${pdfFile.name.replace(/\.[^/.]+$/, "")}_page_${pageNum}.jpg`;
            const imageFile = new File([blob], fileName, { type: 'image/jpeg' });
            imageFiles.push(imageFile);
        }
    }

    return imageFiles;
}
