import {list,save} from './client.js';
export const get = caseId=>list('audits',caseId);
export const put = row=>save('audits',row);
