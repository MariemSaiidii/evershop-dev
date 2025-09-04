pipeline {
     agent any  // Run on local Jenkins executor (no Kubernetes needed)


    environment {
        // Load Jenkins credentials securely
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        GITHUB_CREDENTIALS = credentials('github-creds')

        // Docker repo
        DOCKERHUB_REPO = "mariem631/evershop"
        
        // Unique Docker image tag (build number)
        IMAGE_TAG = "build-${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git(credentialsId: 'github-creds', url: 'https://github.com/MariemSaiidii/evershop-dev.git', branch: 'main')
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                container('docker') {
                    sh """
                    echo "🔑 Logging into DockerHub..."
                    echo "${DOCKERHUB_CREDENTIALS_PSW}" | docker login -u "${DOCKERHUB_CREDENTIALS_USR}" --password-stdin

                    echo "📦 Building Docker image..."
                    docker build -t $DOCKERHUB_REPO:${IMAGE_TAG} .

                    echo "🚀 Pushing Docker image..."
                    docker push $DOCKERHUB_REPO:${IMAGE_TAG}
                    """
                }
            }
        }

        stage('Update Helm Values & Push') {
            steps {
                script {
                    // Update Helm values.yaml with new image
                    sh """
                    echo "📝 Updating helm/values.yaml with new Docker image..."
                    sed -i 's|repository: .*|repository: $DOCKERHUB_REPO|' helm/values.yaml
                    sed -i 's|tag: .*|tag: ${IMAGE_TAG}|' helm/values.yaml
                    """

                    // Commit and push changes using SSH credentials (safe)
                    sshagent(credentials: ['github-creds']) {
                        sh """
                        git config user.email "ci@jenkins"
                        git config user.name "Jenkins CI"
                        git add helm/values.yaml
                        git commit -m "Update Docker image to ${IMAGE_TAG}" || echo "No changes to commit"
                        git push origin main
                        """
                    }
                }
            }
        }

        //stage('Deploy with Helm') {
           // steps {
             //   sh """
             //   echo "🚀 Deploying app using Helm..."
              //  helm upgrade --install evershop ./helm -f helm/values.yaml
              //  """
            }
       // }
    }
