# Step Functions on Vercel
# Description
The project allows for the dynamic execution of workflows, where each step can be an HTTP request to external services or internal logic. It's designed to showcase how complex workflows can be managed and executed in a serverless environment, providing a scalable and flexible solution for task orchestration.
```sh
curl -X POST "https://aws-steps-functions-on-vercel-mauve.vercel.app/api/step/0?stepIndex=2" \
     -H "Content-Type: application/json" \
     -d '{      
           "nodes": [      
               {            
                   "id": 0,           
                   "data": {                                        
                       "parameters": {    
                           "url": "https://swapi.dev/api/vehicles/",
                           "method": "GET"
                       }
                   }       
               },           
               {
                   "id": 1,           
                   "data": {                                         
                       "parameters": {    
                           "url": "https://swapi.dev/api/people/1/",
                           "method": "GET"
                       }
                   }
               },
               {
                   "id": 2,
                   "data": {
                       "parameters": {
                           "url": "https://swapi.dev/api/planets/1/",
                           "method": "GET"
                       }
                   }
               }
           ]
       }'

```
