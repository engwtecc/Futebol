import { ReactNode } from "react";

interface CardProps {
  title: string;
  value?: string | number;
  children?: ReactNode;
}

export default function Card({ title, value, children }: CardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
      <h3 className="text-gray-500 text-sm">{title}</h3>

      {value && (
        <div className="text-4xl font-bold mt-2 text-slate-800">
          {value}
        </div>
      )}

      {children}
    </div>
  );
}