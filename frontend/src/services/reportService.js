import {list,save} from './client.js';
export const get = caseId=>list('reports',caseId);
export const put = row=>save('reports',row);
