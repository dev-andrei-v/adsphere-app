import {Card, Tabs} from "antd";

export const RecentActivity = () => {
    return <Card title="Activitate recentă">
        <Tabs defaultActiveKey="1">
            <Tabs.TabPane tab="Toate" key="1">
                <ul>
                    <li><b>Ion Popescu</b> a adăugat un anunț nou <b style={{ color: "#6558f5" }}>Imobiliare</b></li>
                    <li><b>Maria Ionescu</b> și-a actualizat profilul</li>
                    <li><b>Admin Alex</b> a aprobat 5 anunțuri <b style={{ color: "#6558f5" }}>Auto</b></li>
                    <li><b>Andrei Vișan</b> a raportat un anunț <b style={{ color: "#6558f5" }}>Electronice</b></li>
                </ul>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Anunțuri" key="2">
                {/* Lista doar cu anunțuri */}
            </Tabs.TabPane>
        </Tabs>
    </Card>
}
