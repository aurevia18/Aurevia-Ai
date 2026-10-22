import {NextResponse} from 'next/server';
import {z,ZodError} from 'zod';
import {requireUser} from '@/lib/auth';
import {generateAureviaText} from '@/lib/ai/openai';
import {rateLimit} from '@/lib/rate-limit';

export const dynamic='force-dynamic';

const schema=z.object({
  accountMode:z.enum(['DEMO','REAL']),
  totalValue:z.string().max(40).regex(/^\d+(?:\.\d+)?$/),
  allocations:z.array(z.object({category:z.string().trim().min(1).max(60),percentage:z.number().finite().min(0).max(100)})).max(20),
});

export async function POST(request:Request){
  try{
    const user=await requireUser();
    rateLimit(`ai-portfolio:${user.id}`,5,60_000);
    const input=schema.parse(await request.json());
    if(input.accountMode!==user.accountMode){
      return NextResponse.json({error:'Refresh the selected account before requesting an explanation.'},{status:409,headers:{'Cache-Control':'private, no-store'}});
    }
    const answer=await generateAureviaText({
      instructions:'You are Aurevia Invest’s portfolio education assistant. Interpret only the supplied aggregate portfolio summary. Do not recommend specific assets or tell the user to buy, sell, or hold. Do not predict returns, imply that simulation values are external assets, or claim a category count guarantees diversification. Highlight concentration, uncertainty, liquidity and risk in plain language. Make clear this is educational information, not personalized financial advice. Do not infer information that is not provided.',
      input:JSON.stringify({accountMode:input.accountMode,totalValue:input.totalValue,currency:'USD',allocations:input.allocations}),
      maxOutputTokens:350,
    });
    if(!answer){
      return NextResponse.json({error:process.env.OPENAI_API_KEY?'AI service is temporarily unavailable. Try again shortly.':'AI explanations are not configured yet. Add OPENAI_API_KEY to the server environment.'},{status:503,headers:{'Cache-Control':'private, no-store'}});
    }
    return NextResponse.json({answer,model:process.env.OPENAI_MODEL?.trim()||'gpt-6-astra'},{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){
    if(error instanceof ZodError)return NextResponse.json({error:'The portfolio summary is invalid. Refresh the page and try again.'},{status:400,headers:{'Cache-Control':'private, no-store'}});
    if(error instanceof Error&&error.message==='RATE_LIMITED')return NextResponse.json({error:'AI portfolio requests are temporarily rate limited.'},{status:429,headers:{'Cache-Control':'private, no-store'}});
    if(error instanceof Error&&error.message==='UNAUTHORIZED')return NextResponse.json({error:'Sign in to request portfolio insights.'},{status:401,headers:{'Cache-Control':'private, no-store'}});
    return NextResponse.json({error:'Portfolio intelligence is temporarily unavailable.'},{status:503,headers:{'Cache-Control':'private, no-store'}});
  }
}
