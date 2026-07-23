import { NavLink } from "react-router-dom";

const menu = [

    ["🏠","Dashboard","/dashboard"],

    ["👥","Jogadores","/jogadores"],

    ["⚽","Pelada","/pelada"],

    ["📜","Histórico","/historico"],

    ["🏆","Ranking","/ranking"],

    ["⚙","Configurações","/configuracoes"]

];

export default function Sidebar(){

    return(

        <aside className="w-64 bg-slate-900 text-white">

            <div className="text-center py-8 text-2xl font-bold border-b border-slate-700">

                Futebol Hawai

            </div>

            <nav className="p-4">

                {

                    menu.map(([icone,nome,rota])=>(

                        <NavLink

                            key={String(rota)}

                            to={String(rota)}

                            className={({isActive})=>

                                `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition

                                ${isActive

                                ? "bg-blue-600"

                                : "hover:bg-slate-700"}

                                `
                            }

                        >

                            <span>{icone}</span>

                            <span>{nome}</span>

                        </NavLink>

                    ))

                }

            </nav>

        </aside>

    )

}