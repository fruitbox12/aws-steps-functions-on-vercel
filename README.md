### Key Components:


-   Middleware Configuration: Uses `NextCors` to set up Cross-Origin Resource Sharing (CORS), allowing requests from any origin.
-   Input Validation: Ensures the request contains necessary data and validates indexes to prevent errors.
-   Workflow Execution:
    -   Cron Jobs: If a node is a trigger, it schedules a cron job.
    -   Webhooks: If a node is a webhook, it registers the webhook accordingly.
    -   HTTP Requests: Other nodes trigger HTTP requests. The results or errors from these operations are stored.
-   State Management: Utilizes custom utilities (`getWorkflowState`, `setWorkflowState`) to save and retrieve the current state of the workflow from a key-value store.
-   MongoDB Integration: At the end of processing, connects to MongoDB to log the execution results for future reference.

### Process Flow:

1.  Validates the incoming request and the current step to be executed.
2.  Depending on the node type (`trigger`, `webhook`, or other), performs the appropriate action (e.g., setting up a cron job or making an HTTP request).
3.  Updates the workflow's state in a key-value store with any new results or errors.
4.  If there are more steps, redirects to the next step; otherwise, it finalizes the process by recording the execution details in a MongoDB collection.
5.  Returns a response with the execution results or an error message.

The script demonstrates how to orchestrate various operations in a workflow, emphasizing asynchronous execution, error handling, and state persistence.

# Step Functions on Vercel
```
[Webhook Trigger: New Survey Response]
                |
                v
       +-----------------+
       | Fetch Survey    |
       | Response (HTTP_1)|
       +-----------------+
                |
                v
  +-------------+-------------+
  | Categorize Response       |
  +-------------+-------------+
  |             |             |
  v             v             v
+--------+   +--------+       +-------------+
|Wishlist|   |Bugs    |       |Other        |
|(HTTP_2)|   |(HTTP_3)|       |Categories...|
+----+       +--------+       +-------------+
  |             |             |
  |             |             |
  |             +-------------+
  |                           |
  |                           v
  |                  +----------------+
  |                  | Generate       |
  |                  | Insights       |
  |                  | (OpenAI_0)     |
  |                  +----------------+
  |                           |
  |                           v
  |                  +----------------+        +----------------+
  |                  | Append Insights|        | Compose        |
  |                  | to AI Sheet    |        | Notification   |
  |                  | (HTTP_4)       |        | Email (OpenAI_1)|
  |                  +----------------+        +----------------+
  |                                                    |
  |                                                    v
  |                                           +----------------+
  +------------------------------------------>| Send Email     |
                                              | (EmailSend_0)  |
                                              +----------------+
```
```
                            [Scheduler]
                  (Cron: "0 */10 * * * *")
                Triggers every 10 minutes
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
                              | (Checks for new GitHub issues)
                              v
                    +---------+---------+
                    |       HTTP_0      |
                    | (/api/step/1)     |
                    | (Fetch new issues)|
                    +---------+---------+
                              |
                              | (GET request to GitHub API)
                              v
                    +---------+---------+
                    |       If Else     |
                    | (Are there new    |
                    |  issues?)         |
                    +--+-------------+--+
                       |             |
           +-----------+             +-----------+
           |                                     |
    [New issues found]                   [No new issues]
           |                                     |
           v                                     v
  +-------+-------+                     +-------+-------+
  |     HTTP_1    |                     |     NodeJS    |
  | (/api/step/2) |                     | (/api/step/3) |
  | (Update issue)|                     | (Log no new   |
  | status & label|                     |  issues found)|
  +---------------+                     +---------------+
        |                                     |
        | (Updates GitHub issue)              | (Logs action)
        v                                     v
  [Next Step or End]               [Next
```
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
