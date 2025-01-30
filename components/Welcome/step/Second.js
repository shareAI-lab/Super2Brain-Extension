import React from "react";
import { ArrowRight } from "lucide-react";

export default function Second({ onNext }) {
  return (
    <div>
      <div className="mb-16 pt-12">
        <h2 className="text-2xl mb-4 flex items-center gap-2">
          <span className="inline-block">🎯</span>
          第二步设置
        </h2>
        <p className="text-lg text-gray-600">
          请选择您想要导入的网页类型,我们将为您生成相应的内容
        </p>
      </div>
      
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "博客文章", desc: "适合文章、教程等内容" },
            { title: "产品页面", desc: "适合商品、服务介绍" },
            { title: "企业官网", desc: "适合公司、机构介绍" },
            { title: "个人主页", desc: "适合个人作品集、简历" }
          ].map((item) => (
            <button
              key={item.title}
              className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <h3 className="font-medium mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <button
          onClick={onNext}
          className="w-fit flex items-center justify-center gap-2 px-6 py-3 text-base rounded-lg transition-colors bg-blue-500 text-white hover:bg-blue-600"
        >
          完成
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
} 