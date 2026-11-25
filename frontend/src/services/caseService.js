import {list,save} from './client.js';
export const get = caseId=>list('cases',caseId);
export const put = row=>save('cases',row);
