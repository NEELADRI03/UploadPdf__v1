import { LightningElement, api } from 'lwc';
import pdfLib from '@salesforce/resourceUrl/PDFLib';
import { loadScript } from 'lightning/platformResourceLoader';

import getFiles from '@salesforce/apex/PdfMergeService.getFiles';
import uploadMergedPdf from '@salesforce/apex/PdfMergeService.saveMergedPdf';

import userId from '@salesforce/user/Id';

export default class DemoPdfUploader extends LightningElement {

    //@api myRecordId;

    userId = userId;

    get encryptedToken(){
        return this.userId;
    }

    uploadedDocIds = [];
    pdfLibInitialized = false;

    acceptedFormats = ['.pdf', '.png', '.jpg', '.jpeg'];

    renderedCallback() {
        if (this.pdfLibInitialized) {
            return;
        }

        this.pdfLibInitialized = true;

        loadScript(this, pdfLib)
            .then(() => {
                console.log('PDF-LIB loaded');
            })
            .catch(error => {
                console.error(error);
            });
    }

    handleUploadFinished(event) {

        const uploadedFiles = event.detail.files;

        // uploadedFiles.forEach(file => {
        //     this.uploadedDocIds.push(file.documentId);
        // });

        const contentVersionIds = uploadedFiles.map(file=>file.contentVersionId);
        console.log('Uploaded Document Ids', contentVersionIds);

        this.mergeFiles(contentVersionIds);
    }

    async mergeFiles(contentVersionIds) {

        if (!contentVersionIds.length) {
            alert('Upload files first');
            return;
        }

        const base64Files = await getFiles({ docIds: contentVersionIds });

        if (base64Files.length === 0) {
                console.log('No PDFs Found');
                return;
            }

        const { PDFDocument } = window.PDFLib;
        const mergedPdfDoc = await PDFDocument.create();

        for (let i = 0; i < base64Files.length; i++) {
            const base64 = base64Files[i];
            console.log(`Processing file ${i + 1} of ${base64Files.length}...`);
                
            const pdfBytes = this.base64ToUint8Array(base64);
                
            const sourcePdfDoc = await PDFDocument.load(pdfBytes);
                
            const copiedPages = await mergedPdfDoc.copyPages(sourcePdfDoc, sourcePdfDoc.getPageIndices());
            copiedPages.forEach(page => mergedPdfDoc.addPage(page));
        }

        const mergedPdfBytes = await mergedPdfDoc.save();

        console.log('PDF Bytes', mergedPdfBytes);
        this.generateOutput(mergedPdfBytes);
        
    }

    base64ToUint8Array(base64) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    /*generateOutput(pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        this.mergedPdfUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = this.mergedPdfUrl;
        a.download = `Merged.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(blob), 1000);
    }*/

    generateOutput(pdfBytes) {

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        const reader = new FileReader();

        reader.onloadend = () => {

            // result looks like: data:application/pdf;base64,JVBERi0xLjQKJ...
            const base64 = reader.result.split(',')[1];

            console.log('BASE64', base64);

            // Call Apex
            this.uploadMergedPdf(base64);
        };

        reader.readAsDataURL(blob);
    }

    uploadMergedPdf(base64Data) {

        uploadMergedPdf({
            base64Data: base64Data,
            //recordId: this.recordId
        })
        .then(() => {
            console.log('PDF uploaded successfully');
        })
        .catch(error => {
            console.error(error);
        });
    }
}