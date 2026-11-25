import {list,save} from './client.js';
export const get = caseId=>list('evidence',caseId);
export const put = row=>save('evidence',row);
