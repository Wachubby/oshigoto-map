import { NextRequest, NextResponse } from "next/server";
export async function GET(req:NextRequest){
  const q=req.nextUrl.searchParams.get("q")||"";
  return NextResponse.json({q, note:"ホワイトリスト内のみ、メディアはタイトル+リンクのみ、SNSはoEmbed", sources:["official","related:安倍なつみ","media:ORICON,NATALIE"], mock:[{source:"公式",text:`${q} リハ`,method:"oEmbed"},{source:"関連 安倍なつみ",text:`夫の${q}が...`,method:"oEmbed"},{source:"ORICON RSS",title:`${q} ツアー`,link:"https://oricon.co.jp/...",method:"RSS"}]});
}
