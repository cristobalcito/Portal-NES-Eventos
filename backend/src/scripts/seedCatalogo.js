var {prismaClient}= require('@prisma/client');
var prisma= new PrismaClient();

async function asegurarTresCatalogos(){
    try{
        var cantidad=await prisma.planBase.count();

        if (cantidad===0){
            await prisma.planBase.createMany({
                data:[
                    {costoBase:150000,
                        descripcion:"Plan basico:Evento basico"
                    },
                    {costoBase:300000,
                        descripcion:"plan estandar:evento estandar"
                    },
                    {costoBase:500000,
                        descripcion:"plan premium:evento premium"
                    }
                ]
            });
            console.log("los planes se han creado exitosamente");
        }
    } catch(error){
        console.error("error al crear los planes:",error);

    }
}
module.exports={asegurarTresCatalogos};