pipeline {
    agent {
        kubernetes {
            cloud 'minikube-cloud'  // Name of the cloud you configured
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: jnlp
    image: jenkins/inbound-agent:latest
    tty: true
  - name: docker
    image: docker:24.0.7
    command:
    - cat
    tty: true
  - name: dind
    image: docker:24.0.7-dind
    securityContext:
      privileged: true
    tty: true
    resources:
      requests:
        cpu: "500m"
        memory: "512Mi"
      limits:
        cpu: "1000m"
        memory: "1024Mi"
"""
        }
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        GITHUB_CREDENTIALS = credentials('github-creds')
        DOCKERHUB_REPO = "mariem631/evershop"
        IMAGE_TAG = "build-${BUILD_NUMBER}"
        DOCKER_HOST = 'tcp://localhost:2375'  // DinD default port
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
                container('docker') {
                    sh '''
                    apt-get update
                    apt-get install -y git openssh-client
                    '''
                    script {
                        sh """
                        echo "📝 Updating helm/values.yaml with new Docker image..."
                        sed -i 's|repository: .*|repository: $DOCKERHUB_REPO|' helm/values.yaml
                        sed -i 's|tag: .*|tag: ${IMAGE_TAG}|' helm/values.yaml
                        """

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
        }

        //stage('Deploy with Helm') {
        //    steps {
        //        sh """
        //        echo "🚀 Deploying app using Helm..."
        //        helm upgrade --install evershop ./helm -f helm/values.yaml
        //        """
        //    }
        //}
    }
}