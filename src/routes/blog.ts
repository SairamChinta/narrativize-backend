import { Hono } from "hono"
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

import { sign, verify } from 'hono/jwt' 
  
export const blogRouter = new Hono<{
      //generic
        Bindings: {
            DATABASE_URL: string
        JWT_SCERET:string
        },
        Variables:{
            userId:string
        }
}>();
  
//midddleware
blogRouter.use('/api/v1/blog/*', async (c,next)=>{
    //get the header ,verfiy the header, if correcrt proceed ,if not errror 403
     const authHeader=c.req.header("Authorization") || "";
     //ok here we get bearer+token so we have to extract into["bearer","token"]
      //const token = authHeader.split("")[1]
     
     const user = await verify(authHeader,c.env.JWT_SCERET);
     if(user){
        c.set("userId",user.id as string)
        await next();
     }
     else{
      c.status(403);
      return c.json({error:"you are not logged in"})
     } 
})
  
  
  blogRouter.post('/blog', async (c) => {
    const body = await c.req.json();
    const authorId = c.get("userId");
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

     const blog = await prisma.blog.create({
        data:{
            title:body.title,
            content:body.content,
            authorId:body.authorId,
        }
     })   

    return c.json({
        id:blog.id
    })
  })

  blogRouter.put('/blog', async (c) => {
    const body = await c.req.json();
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog = await prisma.blog.update({
        where:{
            id:body.id
        },
        data:{
            title:body.title,
            content:body.content            
        }
     })  

    return c.json({
        id:blog.id
  })
})

  blogRouter.get('/:id', async (c) => {
    const body = await c.req.json();
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

   try{
     const blog = await prisma.blog.findFirst({
        where:{
            id:body.id
        },
     })  

    return c.json({ blog })
   } catch(e){
         c.status(411);
        return c.json({
            message:"error while fetching blog post"
        });
    }
})

// add pagination to this endpoint user may ask for 10 posts 
// afterwards while scrolling they asak more
  blogRouter.get('/bulk', async (c) => {
    const body = await c.req.json();
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blogs = await prisma.blog.findMany();

    return c.json({ blogs })
}) 