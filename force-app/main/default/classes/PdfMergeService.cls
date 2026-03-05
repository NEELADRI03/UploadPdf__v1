public without sharing class PdfMergeService {
    
    @AuraEnabled
    public static List<String> getFiles(List<Id> docIds) {
        // return [
        //     SELECT Id, Title, FileType, VersionData
        //     FROM ContentVersion
        //     WHERE Id IN :docIds
        // ];

        List<String> base64StringList = new List<String>();

        try{
            List<ContentVersion> versionList = [SELECT Id, VersionData FROM ContentVersion WHERE Id IN :docIds];

            if(versionList.isEmpty())
            {
                return base64StringList;
            }

            for(ContentVersion cv:versionList)
            {
                base64StringList.add(EncodingUtil.base64Encode(cv.VersionData));
            }
            return base64StringList;
        }catch(Exception e)
        {
            System.debug('Exception : '+e);
            return base64StringList;
        }
        
    }

    @AuraEnabled
    public static Id saveMergedPdf(String base64Data) {

        ContentVersion cv = new ContentVersion();
        cv.Title = 'Merged_File';
        cv.PathOnClient = 'Merged_File.pdf';
        cv.VersionData = EncodingUtil.base64Decode(base64Data);
        insert cv;

        // ContentDocumentLink link = new ContentDocumentLink();
        // link.LinkedEntityId = recordId;
        // link.ContentDocumentId = cv.ContentDocumentId;
        // link.ShareType = 'V';

        // insert link;

        return cv.Id;
    }
}