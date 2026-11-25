import {list,save} from './client.js';
export const get = caseId=>list('users',caseId);
export const put = row=>save('users',row);
