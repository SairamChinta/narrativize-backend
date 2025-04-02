import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify } from 'hono/jwt'



export const userRouter = new Hono<{
    //generic
      Bindings: {
          DATABASE_URL: string
          JWT_SCERET:string
      }
  }>();  
    

   userRouter.post('/signup', async (c) => {
  
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
     
    const body = await c.req.json();
  
    try {
       const user = await prisma.user.create({
        data:{
           email:body.email,
           password:body.password,
           name:body.name
        },
        });
        const jwt=await sign({id:user.id},c.env.JWT_SCERET);
        return c.json({token:jwt});
      } 
      catch (e) {
      console.log(e);
      c.status(411);
      return c.json({error:"invalid"})
      }
  
  })
  
  
  userRouter.post('/signin', async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
     
    const body = await c.req.json();
  try{
    const user = await prisma.user.findUnique({
      where:{
         email:body.email,
         password:body.password,
      },
    });
    if(!user){
      c.status(403);
      return c.json({error:"user not  found"});
    }
    const token=await sign({id:user.id},c.env.JWT_SCERET)
    return c.json({jwt:token});
  } catch(e){
    console.log(e);
    c.status(411);
     return c.json({error:"invalid creds"})
  }
});