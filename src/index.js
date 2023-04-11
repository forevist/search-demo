import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { SearchPOC } from './search';


const root = ReactDOM.createRoot(document.getElementById('root'));
const search = new SearchPOC();
// console.time('fillWorker');
// search.fillWorkerDocument().then(async (test) => {
//   console.timeEnd('fillWorker');
//   const result3 = await search.searchWorker('content123', 10);
//   const result2 = await search.searchWorker('d4a4', 1);
//   const result4 = await search.searchWorker('content123456', 100);
// });

// Test search in simple index
search.fillIndex();
const result6 = search.search('-');
console.log(result6);
const result5 = search.search(' ', true);
console.log(result5);
const result7 = search.serchWords('d4a4 content6 content8', true);

root.render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
);
