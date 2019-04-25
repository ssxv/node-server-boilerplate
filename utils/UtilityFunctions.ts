import * as Enumerable from 'linq';

export function addNumberIfNotExist(sourceNumber: any, targetArr: Array<any>) {
    var exists = false;
    Enumerable.from(targetArr).forEach(x => {
        if (x == sourceNumber) {
            exists = true;
        }
    });
    if (!exists) {
        targetArr.push(sourceNumber);
    }
}

export function deleteFieldIfExists(sourceNumber: any, targetArr: Array<any>) {
    let index = targetArr.indexOf(sourceNumber);
    if (index > -1) {
        targetArr.splice(index, 1);
    }
}

export function exists(obj: any, listOfObjs: Array<any>, keyToMatch: any, stringify?: boolean) {
    var exists = false;
    Enumerable.from(listOfObjs).forEach((listObj: any) => {
        let key1 = obj[keyToMatch];
        let key2 = listObj[keyToMatch];
        if (stringify) {
            key1 = key1.toString();
            key2 = key2.toString();
        }
        if (key1 == key2) {
            exists = true;
        }
    });
    return exists;
}

export function isRolePresent(actualRole: string, listOfRole: Array<string>) {
    var exists = false;
    Enumerable.from(listOfRole).forEach((role: string) => {
        if (role == actualRole) {
            exists = true;
        }
    });
    return exists;
}

export function isNumberPresent(sourceNumber: number, listOfNumbers: Array<number>) {
    var exists = false;
    Enumerable.from(listOfNumbers).forEach((num: number) => {
        if (num == sourceNumber) {
            exists = true;
        }
    });
    return exists;
}

export function populateDefaultFields(fields: Array<String>) {
    fields.push('createdBy');
    fields.push('createdByName');
    fields.push('createdDate');
    fields.push('lastModifiedBy');
    fields.push('lastModifiedByName');
    fields.push('lastModifiedDate');
    fields.push('usersAccessMask');
    fields.push('rolesAccessMask');
    return fields;
}

export function isDateEqual(date1, date2) {
    date1 = new Date(date1);
    date2 = new Date(date2);
    return (date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate());
}

export function isInt(value) {
    var x = parseFloat(value);
    return !isNaN(value) && (x | 0) === x;
}

export function getAmPmTime(time: number) {
    if (time === 0) return '12:00 am';
    if (!time) return '';
    let hm = toHoursMinutes(time);
    var ampm = hm.hours >= 12 ? 'pm' : 'am';
    hm.hours = hm.hours % 12;
    hm.hours = hm.hours ? hm.hours : 12;// the hour '0' should be '12'
    var strTime = hm.hours + ':' + hm.minutes + ' ' + ampm;
    return strTime;
}

export function toHoursMinutes(mins) {
    const hours = Math.trunc(mins / 60);
    let minutes:any = mins % 60;
    if (minutes == 0) {
        minutes = '00'; 
    }
    return { hours, minutes };
}
