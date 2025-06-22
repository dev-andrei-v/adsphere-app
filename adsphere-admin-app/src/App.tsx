import {Authenticated, ErrorComponent, Refine} from "@refinedev/core";
import {DevtoolsPanel, DevtoolsProvider} from "@refinedev/devtools";
import {RefineKbar, RefineKbarProvider} from "@refinedev/kbar";

import {ThemedLayoutV2, ThemedSiderV2, ThemedTitleV2, useNotificationProvider} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import routerBindings, {
    CatchAllNavigate,
    DocumentTitleHandler, NavigateToResource,
    UnsavedChangesNotifier,
} from "@refinedev/react-router";
import {App as AntdApp} from "antd";
import {BrowserRouter, Outlet, Route, Routes} from "react-router";
import {authProvider} from "./providers/authProvider";
import {ColorModeContextProvider} from "./contexts/color-mode";
import {Header} from "./components";
import {Login} from "./pages/login";
import {CategoryCreate, CategoryEdit, CategoryList, CategoryShow} from "./pages/categories";

import {dataApiProvider} from "./providers/dataApiProvider";
import {DashboardPage} from "./pages/dashboard";
import {DashboardOutlined, FileTextOutlined, FolderOutlined, SettingOutlined, TeamOutlined} from "@ant-design/icons";
import {AdEdit, AdList} from "./pages/ads";
import {UserList} from "./pages/users/list";
import { LogsList } from "./pages/log";

/**
 * Here we define the resources that we want to use in our application (like the routes)
 */
const resources = [
    {
        name: "dashboard", // e folosit ca `route` id
        list: "/",
        meta: {
            label: "Dashboard",
            icon: <DashboardOutlined/>,
            route: "/", // important: trebuie să fie în `meta`, nu `options`
        },
    },
    {
        name: "ads",
        list: "/ads",
        edit: "/ads/edit/:id",
        show: "/ads/show/:id",
        meta: {
            label: "Ads",
            icon: <FileTextOutlined/>
        }
    },
    {
        name: "categories",
        list: "/categories",
        create: "/categories/create",
        edit: "/categories/edit/:id",
        show: "/categories/show/:id",
        meta: {
            label: "Categories",
            icon: <FolderOutlined/>
        }
    },
    {
        name: "users",
        list: "/users",
        meta: {
            label: "Users",
            icon: <TeamOutlined/>
        }
    },
    {
        name: "logs",
        list: "/logs",
        meta: {
            label: "Logs",
            icon: <SettingOutlined/>
        }
    }
]

function App() {
    return (
        <BrowserRouter>
            {/*<GitHubBanner />*/}
            <RefineKbarProvider>
                <ColorModeContextProvider>
                    <AntdApp>
                        <DevtoolsProvider>
                            <Refine
                                dataProvider={dataApiProvider}
                                notificationProvider={useNotificationProvider}
                                routerProvider={routerBindings}
                                authProvider={authProvider}
                                options={{
                                    syncWithLocation: true,
                                    warnWhenUnsavedChanges: true,
                                    useNewQueryKeys: true,
                                    projectId: "7X596j-dtHvjg-ww7O25",
                                }}
                                resources={resources}
                            >
                                <Routes>
                                    <Route
                                        element={
                                            <Authenticated
                                                key="authenticated-inner"
                                                fallback={<CatchAllNavigate to="/login"/>}
                                            >
                                                <ThemedLayoutV2
                                                    Title={({ collapsed }) => (
                                                        <ThemedTitleV2
                                                            collapsed={collapsed}
                                                            icon={<SettingOutlined style={{fontSize: "24px"}}/>}
                                                            text="Adsphere Admin"
                                                        />
                                                    )}
                                                    Header={Header}
                                                    Sider={(props) => <ThemedSiderV2 {...props} fixed/>}
                                                >
                                                    <Outlet/>
                                                </ThemedLayoutV2>
                                            </Authenticated>
                                        }
                                    >
                                        <Route path="/"
                                               index
                                               element={<DashboardPage/>}
                                        />
                                        <Route path="/ads">
                                            <Route index element={<AdList/>}/>
                                            <Route path="edit/:id" element={<AdEdit/>}/>
                                        </Route>
                                        <Route path="/categories">
                                            <Route index element={<CategoryList/>}/>
                                            <Route path="create" element={<CategoryCreate/>}/>
                                            <Route path="show/:id" element={<CategoryShow/>}/>
                                            <Route path="edit/:id" element={<CategoryEdit/>}/>
                                        </Route>

                                        <Route path="/users">
                                            <Route index element={<UserList/>}/>
                                        </Route>

                                        <Route path="/logs">
                                            <Route index element={<LogsList/>}/>
                                        </Route>

                                        <Route path="*" element={<ErrorComponent/>}/>
                                    </Route>
                                    <Route
                                        element={
                                            <Authenticated
                                                key="authenticated-outer"
                                                fallback={<Outlet/>}
                                            >
                                                <NavigateToResource/>
                                            </Authenticated>
                                        }
                                    >
                                        <Route path="/login" element={<Login/>}/>
                                    </Route>
                                </Routes>
                                <RefineKbar/>
                                <UnsavedChangesNotifier/>
                                <DocumentTitleHandler/>
                            </Refine>
                            <DevtoolsPanel/>
                        </DevtoolsProvider>
                    </AntdApp>
                </ColorModeContextProvider>
            </RefineKbarProvider>
        </BrowserRouter>
    );
}

export default App;
