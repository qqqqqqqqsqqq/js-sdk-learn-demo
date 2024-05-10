import React, {useEffect, useState} from 'react'
import ReactDOM from 'react-dom/client'
import List from './list'; // 引入 List.tsx 文件
import SearchUser, {getCurrentUserInfo} from './searchUser';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <LoadApp/>
    </React.StrictMode>
)

function LoadApp() {


    return <div>
        <div style={{margin: 10}}>
            <SearchUser/>

        </div>
        <List />
        {/*<div style={{margin: 10}}>*/}
        {/*    <div>Select Currency</div>*/}
        {/*    <Select options={CURRENCY} style={{width: 120}} onSelect={setCurrency}/>*/}
        {/*    <Button style={{marginLeft: 10}} onClick={transform}>transform</Button>*/}
        {/*</div>*/}
    </div>
}