import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function ro(role:string){return role==='CUSTOMS'||role==='AUDITOR'}
export async function POST(req:Request){
  const u=await getCurrentUser();if(!u)return Response.json({error:'unauthorized'},{status:401});if(ro(u.role))return Response.json({error:'read_only'},{status:403});
  const b=await req.json();
  const item=await prisma.item.upsert({where:{companyId_code:{companyId:u.companyId,code:String(b.itemCode).trim()}},update:{name:b.itemName||undefined,hsCode:b.hsCode||undefined,unit:b.unit||undefined},create:{companyId:u.companyId,code:String(b.itemCode).trim(),name:b.itemName||String(b.itemCode).trim(),hsCode:b.hsCode||null,unit:b.unit||'PCS'}});
  const wh=await prisma.warehouse.upsert({where:{companyId_code:{companyId:u.companyId,code:b.warehouseCode||'MAIN'}},update:{},create:{companyId:u.companyId,code:b.warehouseCode||'MAIN',name:b.warehouseCode||'Gudang Utama'}});
  const tx=await prisma.transaction.create({data:{companyId:u.companyId,itemId:item.id,warehouseId:wh.id,type:b.type,qty:Number(b.qty),transactionAt:new Date(b.transactionAt),referenceNo:b.referenceNo||null,invoiceNo:b.invoiceNo||null,partnerName:b.partnerName||null,customsDocType:b.customsDocType||null,customsDocNo:b.customsDocNo||null,customsDocDate:b.customsDocDate?new Date(b.customsDocDate):null,notes:b.notes||null,source:'MANUAL',createdById:u.id}});
  await prisma.auditLog.create({data:{companyId:u.companyId,userId:u.id,action:'CREATE',entity:'TRANSACTION',entityId:tx.id,metadata:{source:'MANUAL'}}});return Response.json({ok:true,id:tx.id})
}

export async function PATCH(req:Request){
  const u=await getCurrentUser();if(!u)return Response.json({error:'unauthorized'},{status:401});if(ro(u.role))return Response.json({error:'read_only'},{status:403});
  const b=await req.json();const old=await prisma.transaction.findFirst({where:{id:b.id,companyId:u.companyId},include:{item:true,warehouse:true}});if(!old)return Response.json({error:'not_found'},{status:404});
  const item=await prisma.item.findFirst({where:{id:b.itemId,companyId:u.companyId}});const wh=await prisma.warehouse.findFirst({where:{id:b.warehouseId,companyId:u.companyId}});if(!item||!wh)return Response.json({error:'bad_master'},{status:400});
  const tx=await prisma.transaction.update({where:{id:old.id},data:{itemId:item.id,warehouseId:wh.id,type:b.type,qty:Number(b.qty),transactionAt:new Date(b.transactionAt),referenceNo:b.referenceNo||null,invoiceNo:b.invoiceNo||null,partnerName:b.partnerName||null,customsDocType:b.customsDocType||null,customsDocNo:b.customsDocNo||null,customsDocDate:b.customsDocDate?new Date(b.customsDocDate):null,notes:b.notes||null}});
  await prisma.auditLog.create({data:{companyId:u.companyId,userId:u.id,action:'UPDATE',entity:'TRANSACTION',entityId:tx.id,metadata:{before:{item:old.item.code,warehouse:old.warehouse.code,type:old.type,qty:String(old.qty),date:old.transactionAt.toISOString(),referenceNo:old.referenceNo},after:{item:item.code,warehouse:wh.code,type:tx.type,qty:String(tx.qty),date:tx.transactionAt.toISOString(),referenceNo:tx.referenceNo}}}});return Response.json({ok:true})
}

export async function DELETE(req:Request){
  const u=await getCurrentUser();if(!u)return Response.json({error:'unauthorized'},{status:401});if(ro(u.role))return Response.json({error:'read_only'},{status:403});
  const {id}=await req.json();const old=await prisma.transaction.findFirst({where:{id,companyId:u.companyId},include:{item:true,warehouse:true}});if(!old)return Response.json({error:'not_found'},{status:404});
  const ids=old.transferGroupId?(await prisma.transaction.findMany({where:{companyId:u.companyId,transferGroupId:old.transferGroupId},select:{id:true}})).map(x=>x.id):[old.id];
  await prisma.transaction.deleteMany({where:{id:{in:ids},companyId:u.companyId}});
  await prisma.auditLog.create({data:{companyId:u.companyId,userId:u.id,action:'DELETE',entity:'TRANSACTION',entityId:old.id,metadata:{deletedIds:ids,item:old.item.code,warehouse:old.warehouse.code,type:old.type,qty:String(old.qty),referenceNo:old.referenceNo}}});return Response.json({ok:true,deleted:ids.length})
}
