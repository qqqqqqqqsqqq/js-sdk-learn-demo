import { IOpenUser } from '@lark-base-open/js-sdk';


export type MetaItem = {
    [key: string]: {

        title: string;
        description: string;
        acceptor: IOpenUser[];

        lastTime: string;
    };
};