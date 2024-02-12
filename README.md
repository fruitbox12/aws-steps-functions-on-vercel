# Step Functions on Vercel
```
                          [Scheduler]
                (Cron: "0 */10 * * * *")
                      Triggers every 10 seconds
                                 |
                                 | (Cron job executes)
                                 v
                [Trigger] POST /api/step/0?stepIndex=2
                                 |
                                 v
                      +-------------------+
                      |   Step 0: Start   |
                      | (/api/step/0)     |
                      +---------+---------+
                                |
                                | (Initial step of the workflow)
                                v
                      +---------+---------+
                      |       HTTP_0      |
                      | (/api/step/1)     |
                      +---------+---------+
                                |
                                | (GET request to GitHub API)
                                v
                      +---------+---------+
                      |       If Else     |
                      | (Decision based   |
                      |  on HTTP_0 resp)  |
                      +--+-------------+--+
                         |             |
             +-----------+             +-----------+
             |                                     |
      [true path]                          [false path]
             |                                     |
             v                                     v
    +-------+-------+                     +-------+-------+
    |     HTTP_1    |                     |     NodeJS    |
    | (/api/step/2) |                     | (/api/step/3) |
    +---------------+                     +---------------+
          |                                     |
          | (POST request to close issue)       | (Executes custom JS)
          v                                     v
    [Next Step or End of Workflow]   [Next Step or End of Workflow]

```
```
Trigger() POST => /api/step/STEP_NUMBER?stepIndex=FINAL_STEP_NUMBER
+----------------+      +---------------------+       +-------------------+
|                |      |                     |       |                   |
|Parse POST body |----->| Validate stepIndex  |------>|  Execute HTTP     |
|                |      |                     |       |  Node for Current |
+----------------+      +---------------------+       |  Step             |
         |                       |                    |                   |
         |                       |                    +-------------------+
         |                       |                               |
         |                       |                     +-------------------+
         |                       |                     |                   |
         |                       +-------------------->|  Update Workflow  |
         |                                             |  State            |
         |                                             |                   |
         +-------------------------------------------->|                   |
                                                       +-------------------+
                                                               |
                     +-------------------+                     |
                     |                   |<--------------------+
                     |  Check for More   |
                     |  Steps            |
                     |                   |
                     +-------------------+
                             |
            +----------------+----------------+
            |                                 |
    +---------------+                 +--------------+
    |               |                 |              |
    |  Redirect to  |                 |  Complete    |
    |  Next Step    |                 |  Workflow    |
    |               |                 |              |
    +---------------+                 +--------------+
```
For Parallel Nodes:
```
+----------------+      +---------------------+
|                |      |                     |
|  Parse Request |----->| Validate stepIndex  |
|                |      |                     |
+----------------+      +---------------------+
         |                       |
         |                       |
         |                       |
         |             +-------------------------+
         |             |                         |
         |             |  Determine Parallel     |
         |             |  Execution Paths        |
         |             |                         |
         |             +-------------------------+
         |                       |
         |                       |     Trigger() POST => /api/step/(Node 1)?stepIndex=FINAL_STEP_NUMBER
         |                       |     Trigger() POST => /api/step/(..Node N)?stepIndex=FINAL_STEP_NUMBER
+----------------+      /-------------------------------------------------------\
|                |      |         Parallel Execution    |                       |
|  /api/parallel |----->|-------------------------------|-----------------------|
|  Parallel      |      |  Execute HTTP Node 1  |  ...  |  Execute HTTP Node N  |
|  Executions    |      |-----------------------|-------|-----------------------|
+----------------+      \-------------------------------------------------------/
         |                       |
         |                       |
         |             +-------------------------+
         |             |                         |
         |             |  Synchronize and        |
         |             |  Update Workflow State  |
         |             |                         |
         |             +-------------------------+
         |                       |
         |                       |
         |                       |
+----------------+      +---------------------+
|                |      |                     |
|  Check for     |<-----|  All Tasks          |
|  More Steps    |      |  Completed          |
|                |      |                     |
+----------------+      +---------------------+
         |
+----------------+
|                |
|  Next Steps or |
|  Complete      |
|  Workflow      |
+----------------+
```
# Description
The project allows for the dynamic execution of workflows, where each step can be an HTTP request to external services or internal logic. It's designed to showcase how complex workflows can be managed and executed in a serverless environment, providing a scalable and flexible solution for task orchestration.
```sh
curl -X POST "https://aws-steps-functions-on-vercel-mauve.vercel.app/api/step/0?stepIndex=2" \
     -H "Content-Type: application/json" \
     -d '{      
           "nodes": [      
               {            
                   "id": 0,            # first() =>    
                   "data": {                                        
                       "parameters": {    
                           "url": "https://swapi.dev/api/vehicles/",
                           "method": "GET"
                       }
                   }       
               },           
               {
                   "id": 1,     # then() =>      
                   "data": {                                         
                       "parameters": {    
                           "url": "https://swapi.dev/api/people/1/",
                           "method": "GET"
                       }
                   }
               },
               {              # finally() =>                
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
