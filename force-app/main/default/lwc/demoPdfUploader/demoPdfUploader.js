import { LightningElement,api } from 'lwc';

export default class DemoPdfUploader extends LightningElement {

    @api myRecordId;

    get encryptedToken() {
        //use apex to get
        return '98nbx9ebsi99XAuw';
    }

    get acceptedFormats() {
        return [".pdf", ".png"];
    }

    handleUploadFinished(event) {
        // Get the list of uploaded files
        const uploadedFiles = event.detail.files;
        console.log('Uploaded Files: ',uploadedFiles);
        alert("No. of files uploaded : " + uploadedFiles.length);
    }
}