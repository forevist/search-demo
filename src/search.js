import { Index, Document } from 'flexsearch';
import { pipeline } from 'flexsearch/src/lang';
import model from './testModel.json';

// хак для изменения "перекодировки" слов. Может можно сделать получше (надо чуток покопаться в доке, и глянуть в кастомизацию)
// по умолчанию разделителями считаются все знаки препинания, валют, любые переносы и еще что-то
/**
 * [\p{Z}\p{S}\p{P}\p{C}]+
\p{Z} matches any kind of whitespace or invisible separator
\p{S} matches any math symbols, currency signs, dingbats, box-drawing characters, etc
\p{P} matches any kind of punctuation character
\p{C} matches invisible control characters and unused code points
 */
const regex_whitespace = /[\p{Z}]+/ug;
function encode(str){
    str = "" + str;
    return pipeline.call(
        this,
        /* string: */ str.toLowerCase(),
        /* normalize: */ false,
        /* split: */ false,// для поиска по разделителям. Так нам не придется прыгать через слово, и индексировать все айтемы от ядра
        /* collapse: */ false
    );
}

export class SearchPOC {
    constructor() {
        // init index 
        this.index = new Index({tokenize: 'full', encode});
        
        // init document index
        this.document = new Document({
            tokenize: 'full',
            worker: true,
            document: {
                id: "id",
                store: true,
                index: "content"
            }
        });
    }

    fillIndex() {
        console.time('time to init search index');

        // generate index for search
        model.forEach(element => {
            this.index.add(element.id, element.content);
        });

        console.timeEnd('time to init search index');
    }

    async fillWorkerDocument() {
        return Promise.all(model.map(async element => {
            return this.document.addAsync(element);
        }));
    }

    // auerry - string, all - search top 100< or all entrance
    search(querry, all = false) {
        let start = Date.now();

        console.time(`${querry}${all}`);
        if (!all) {
            const result = this.index.search(querry);
            console.timeEnd(`${querry}${all}`);
            console.log(`${querry}${all}`, Date.now() - start);
            return result;
        }

        const result = [];
        let limit = 10;
        let offset = 0;
        let tempResult;
        // search loop with (padgination)
        do {
            tempResult = this.index.search(querry, {limit, offset});
            offset = offset + tempResult.length;
            result.push(...tempResult);
        } while (tempResult.length === limit)
        
        console.timeEnd(`${querry}${all}`);
        console.log(`${querry}${all}`, Date.now() - start);

        return result;
    }
    
    async searchWorker(querry, key) {
        let start = Date.now();
        console.time(`${querry}${key}`);
        // pluck: "content" - явно указываем, что ищем только по этому полю, и возвращаем результаты только для этого ключа
        // библотека просто поддерживает индексацию и поиск по нескольким полям
        const result = await this.document.searchAsync(querry, { pluck: "content", enrich: true });
        console.timeEnd(`${querry}${key}`);
        console.log(`${querry}${key}`, Date.now() - start);

        return result;
    }


    serchWords(querry) {
        const querryArray = querry.split(regex_whitespace);
        let tempResults = this.search(querryArray[0], true);
        let i = 1;
        let nextItems = [];
        while (i < querryArray.length && tempResults.length !== 0) {
            nextItems = tempResults.map(itemIndex => model[itemIndex + 2]);
            tempResults = [];
            // after first finding looking for next while we have something for search or chain was brocked
            nextItems.forEach((current) => {
                if (current && current.content === querryArray[i]) {
                    tempResults.push(current.id);
                }
            });   
            i++; 
        }
        // simple calc first from last (just for storing info)
        const result = tempResults.map(last => {
            const first = last - (querryArray.length - 1) * 2;
            const temp = [];
            for (let i = first; i <= last; i++) {
                temp.push(model[i]);
            }
            return temp;
        })

        return result;
    }
}