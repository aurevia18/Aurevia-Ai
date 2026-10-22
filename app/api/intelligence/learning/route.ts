import {NextResponse} from 'next/server';
import {z,ZodError} from 'zod';
import {requireUser} from '@/lib/auth';
import {generateAureviaText} from '@/lib/ai/openai';
import {rateLimit} from '@/lib/rate-limit';

export const dynamic='force-dynamic';
const schema=z.object({topic:z.enum(['Diversification','Risk management','Planning'])});

export async function POST(request:Request){
  try{
    const user=await requireUser();
    rateLimit(`ai-learning:${user.id}`,5,60_000);
    const {topic}=schema.parse(await request.json());
    const answer=await generateAureviaText({
      instructions:'Create one short, practical investor-education discussion scenario for a fictional learner. Do not write a testimonial, claim a real person exists, describe real earnings or withdrawals, promise returns, recommend a specific asset, or imply investment success. Clearly label the scenario fictional. End with one reflective question. Topic is limited to the user-provided category.',
      input:`Create a fictional educational learning scenario about: ${topic}. Keep it under 140 words and use a short title.`,
      maxOutputTokens:220,
    });
    if(!answer)return NextResponse.json({error:process.env.OPENAI_API_KEY?'AI learning network is temporarily unavailable.':'Add OPENAI_API_KEY to the server environment to enable generated learning scenarios.'},{status:503,headers:{'Cache-Control':'private, no-store'}});
    return NextResponse.json({topic,scenario:answer,fictional:true},{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){
    if(error instanceof ZodError)return NextResponse.json({error:'Choose a supported learning topic.'},{status:400,headers:{'Cache-Control':'private, no-store'}});
    if(error instanceof Error&&error.message==='RATE_LIMITED')return NextResponse.json({error:'Learning-scenario requests are temporarily rate limited.'},{status:429,headers:{'Cache-Control':'private, no-store'}});
    if(error instanceof Error&&error.message==='UNAUTHORIZED')return NextResponse.json({error:'Sign in to generate a learning scenario.'},{status:401,headers:{'Cache-Control':'private, no-store'}});
    return NextResponse.json({error:'Learning network is temporarily unavailable.'},{status:503,headers:{'Cache-Control':'private, no-store'}});
  }
}
