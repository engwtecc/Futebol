import { Outlet } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

export default function MainLayout() {

    return (

        <div className="flex h-screen bg-slate-100">

            <Sidebar />

            <div className="flex flex-1 flex-col">

                <Header />

                <main className="flex-1 overflow-auto p-6">

                    <Outlet />

                </main>

            </div>

        </div>

    );

}